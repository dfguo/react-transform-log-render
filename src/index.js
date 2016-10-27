const countRender = {};

function updateCountRender(componentId) {
  let count = countRender[componentId] || 0;
  count++;
  countRender[componentId] = count;

  return count;
}

function inArray(componentName, list) {
  return list.some((item) => {
    if (componentName === item) {
      return true;
    }
  });
}

const comparePropsAndState = (component, prevProps, prevState) => {
  const propChanges = [];
  const stateChanges = [];

  for (let key in prevProps) {
    if (component.props[key] !== prevProps[key]) propChanges.push(key)
  }

  for (let key in prevState) {
    if (component.state[key] !== prevState[key]) stateChanges.push(key)
  }

  return { propChanges, stateChanges };
}

export default function logRender({ components, imports }) {
  const options = imports[0];
  return function wrap(ReactClass, componentId) {
    const originalRender = ReactClass.prototype.render;
    const originalComponentDidUpdate = ReactClass.prototype.componentDidUpdate;
    const displayName = components[componentId].displayName;
    let enableLog = true;

    if (options) {
      enableLog = options.include ? enableLog && inArray(displayName, options.include) : enableLog;
      enableLog = options.exclude ? enableLog && !inArray(displayName, options.exclude) : enableLog;
    }

    if (enableLog) {
      ReactClass.prototype.render = function () {
        const startTime = new Date().getTime();
        const result = originalRender.apply(this, arguments);
        const count = updateCountRender(componentId);
        if (console.groupCollapsed) {
          console.groupCollapsed(`render: ${displayName} (${count}): ${+new Date() - startTime}ms`);
        } else {
          console.log('------')
          console.log(`render: ${displayName} (${count}): ${+new Date() - startTime}ms`);
        }
        console.log('props', this.props);
        console.log('state', this.state);
        if (this._diff) {
          console.info('Props key changes:', this._diff.propChanges);
          console.info('State key changes:', this._diff.stateChanges);
        }
        if (console.groupCollapsed) {
          console.groupEnd();
        } else {
          console.log('------')
        }
        return result;
      }
      ReactClass.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        this._diff = comparePropsAndState(this, prevProps, prevState);
        if (originalComponentDidUpdate) {
          return originalComponentDidUpdate.apply(this, arguments);
        }
      }
    }

    return ReactClass;
  };
}
// const getCustomSettings = () => {
//   let opts = {};
//   try {
//     return opts = require(process.env.ROOT+'/rdefender.json');
//   } catch(err) {}
//   return opts;
// }
//
// const customSettings = getCustomSettings();
//
// const comparePropsAndState = (component, prevProps, prevState) => {
//   const propChanges = [];
//   const stateChanges = [];
//
//   for (let key in prevProps) {
//     if (component.props[key] !== prevProps[key]) propChanges.push(key)
//   }
//
//   for (let key in prevState) {
//     if (component.state[key] !== prevState[key]) stateChanges.push(key)
//   }
//
//   return { propChanges, stateChanges };
// }
//
// export default function logRender({ components, imports }) {
//   const options = imports[0];
//   return function wrap(ReactClass, componentId) {
//     const originalComponentDidMount = ReactClass.prototype.componentDidMount;
//     const originalComponentDidUpdate = ReactClass.prototype.componentDidUpdate;
//
//     ReactClass.prototype.componentDidMount = function componentDidMount() {
//       this.previousRenderTimeStamp = new Date();
//       if (originalComponentDidMount) {
//         return originalComponentDidMount.apply(this, arguments);
//       }
//     }
//
//     ReactClass.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
//       const newRenderTimeStamp = new Date();
//       const timeRenderDiff = newRenderTimeStamp - this.previousRenderTimeStamp;
//       const threshold = customSettings[this.constructor.name] || 200
//
//       if(!customSettings.quiet_mode) {
//         if (timeRenderDiff < threshold) {
//           const diff = comparePropsAndState(this, prevProps, prevState);
//           console.groupCollapsed(`The component ${this.constructor.name} rendered twice in less than ${threshold}ms!`);
//           console.info('Time between renders:', timeRenderDiff);
//           console.info('Props key changes:', diff.propChanges);
//           console.info('State key changes:', diff.stateChanges);
//           console.groupEnd();
//         }
//       }
//
//       this.previousRenderTimeStamp = newRenderTimeStamp;
//
//       if (originalComponentDidUpdate) {
//         return originalComponentDidUpdate.apply(this, arguments);
//       }
//     }
//
//     return ReactClass;
//   };
// }
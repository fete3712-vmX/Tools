// Example:
// ezstore.set('recording', { title: 'Demo', duration: 30 });
// console.log(ezstore.get('recording'));
// ezstore.remove('recording');

//====================//
  //     EasyStorage   //
 //    Licencse: MIT  // BULIT BY (@fete3712-vmX)
//==================//

//<script src="https://raw.githubusercontent.com/fete3712-vmX/Tools/refs/heads/main/Tools/EzStore.js"></script>

function getStorage(type = 'local') {
  if (type === 'local' || type === 'localStorage') {
    return globalThis.localStorage;
  }

  if (type === 'session' || type === 'sessionStorage') {
    return globalThis.sessionStorage;
  }

  throw new TypeError(`Unknown storage type: ${type}`);
}

globalThis.ezstore = {
  set(key, value, type = 'local') {
    getStorage(type).setItem(key, JSON.stringify(value));
  },

  get(key, type = 'local') {
    const item = getStorage(type).getItem(key);
    if (item === null) return null;

    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  },

  remove(key, type = 'local') {
    getStorage(type).removeItem(key);
  },

  clear(type = 'local') {
    getStorage(type).clear();
  }
};

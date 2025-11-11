export class Entity {
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.x = 0;
    this.y = 0;
    this.components = {};
  }

  add(name, data) {
    this.components[name] = data;
    return this;
  }

  get(name) {
    return this.components[name];
  }

  has(name) {
    return name in this.components;
  }

  remove(name) {
    delete this.components[name];
  }
}

export const createEntity = (id, type) => new Entity(id, type);

import { EventEmitter } from 'events';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  publish(eventType, payload) {
    this.emit(eventType, payload);
  }

  subscribe(eventType, handler) {
    this.on(eventType, handler);
  }

  unsubscribe(eventType, handler) {
    this.off(eventType, handler);
  }
}

export const eventBus = new EventBus();

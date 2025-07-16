// 이벤트 위임을 위한 전역 이벤트 맵
const eventMap = new Map();

// 루트 요소들의 이벤트 리스너 설정 상태 추적
const rootListeners = new Set();

/**
 * 루트 요소에 이벤트 위임 리스너를 설정
 */
export function setupEventListeners(root) {
  if (rootListeners.has(root)) {
    return;
  }

  // 모든 이벤트 타입에 대해 위임 리스너 등록
  const eventTypes = ["click", "focus", "blur", "keydown", "keyup", "mouseover", "mouseout", "change", "input"];

  eventTypes.forEach((eventType) => {
    root.addEventListener(
      eventType,
      (e) => {
        let target = e.target;

        // 이벤트 버블링을 따라 올라가면서 핸들러 찾기
        while (target && target !== root) {
          const targetMap = eventMap.get(target);
          if (targetMap && targetMap.has(eventType)) {
            const handlers = targetMap.get(eventType);
            // 모든 핸들러 실행
            handlers.forEach((handler) => {
              try {
                handler(e);
              } catch (error) {
                console.error(`Event handler error for ${eventType}:`, error);
              }
            });
            // 이벤트 처리했으면 전파 중단
            e.stopPropagation();
            return;
          }
          target = target.parentNode;
        }
      },
      false, // capture 대신 bubble 단계에서 처리
    );
  });

  rootListeners.add(root);
}

/**
 * 요소에 이벤트 핸들러 등록
 */
export function addEvent(element, eventType, handler) {
  if (!eventMap.has(element)) {
    eventMap.set(element, new Map());
  }

  const elementEvents = eventMap.get(element);
  if (!elementEvents.has(eventType)) {
    elementEvents.set(eventType, new Set());
  }

  elementEvents.get(eventType).add(handler);
}

/**
 * 요소에서 이벤트 핸들러 제거
 */
export function removeEvent(element, eventType, handler) {
  const elementEvents = eventMap.get(element);
  if (!elementEvents) return;

  const handlers = elementEvents.get(eventType);
  if (!handlers) return;

  handlers.delete(handler);

  // 핸들러가 없으면 이벤트 타입 제거
  if (handlers.size === 0) {
    elementEvents.delete(eventType);
  }

  // 이벤트가 없으면 요소 제거
  if (elementEvents.size === 0) {
    eventMap.delete(element);
  }
}

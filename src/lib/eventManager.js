// 이벤트 저장소: element -> eventType -> handlers Set
const eventMap = new Map();

// 이미 설정된 루트 요소들
const initializedRoots = new Set();

/**
 * 루트 요소에 이벤트 위임 리스너를 설정
 */
export function setupEventListeners(root) {
  if (initializedRoots.has(root)) return;

  const eventTypes = ["click", "focus", "blur", "keydown", "keyup", "mouseover", "mouseout", "change", "input"];

  // 모든 이벤트 타입에 대해 위임 리스너 등록
  eventTypes.forEach((eventType) => {
    root.addEventListener(
      eventType,
      (event) => {
        handleDelegatedEvent(event, root, eventType);
      },
      false,
    );
  });

  initializedRoots.add(root);
}

/**
 * 요소에 이벤트 핸들러 등록
 */
export function addEvent(element, eventType, handler) {
  // element에 대한 Map이 없으면 생성
  if (!eventMap.has(element)) {
    eventMap.set(element, new Map());
  }

  const elementEvents = eventMap.get(element);

  // eventType에 대한 Set이 없으면 생성
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

  // 빈 Set/Map 정리
  if (handlers.size === 0) {
    elementEvents.delete(eventType);
  }
  if (elementEvents.size === 0) {
    eventMap.delete(element);
  }
}

// 이벤트 위임 처리
function handleDelegatedEvent(event, root, eventType) {
  let currentTarget = event.target;

  // 버블링을 따라 올라가면서 핸들러 찾기
  while (currentTarget && currentTarget !== root) {
    const elementEvents = eventMap.get(currentTarget);

    if (elementEvents && elementEvents.has(eventType)) {
      const handlers = elementEvents.get(eventType);

      // 모든 핸들러 실행
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`이벤트 핸들러 오류 (${eventType}):`, error);
        }
      });

      event.stopPropagation();
      return;
    }

    currentTarget = currentTarget.parentNode;
  }
}

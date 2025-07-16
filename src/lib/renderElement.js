import { setupEventListeners } from "./eventManager";
import { createElement } from "./createElement";
import { normalizeVNode } from "./normalizeVNode";
import { updateElement } from "./updateElement";

export function renderElement(vNode, container) {
  const normalizedVNode = normalizeVNode(vNode);

  // 최초 렌더링 체크: container에 첫 번째 자식이 없으면 최초 렌더링
  if (!container.firstChild) {
    // 최초 렌더링: createElement로 DOM 생성하여 추가
    const element = createElement(normalizedVNode);
    container.appendChild(element);
  } else {
    // 업데이트: 기존 DOM과 새 vNode 비교하여 차분 업데이트
    updateElement(container, normalizedVNode, container._vNode, 0);
  }

  // 현재 vNode를 container에 저장 (다음 업데이트 시 비교용)
  container._vNode = normalizedVNode;

  // 이벤트 리스너 설정
  setupEventListeners(container);
}

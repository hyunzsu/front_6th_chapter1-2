import { createElement } from "./createElement";
import { addEvent, removeEvent } from "./eventManager";

/**
 * 속성 업데이트
 */
function updateAttributes(target, newProps, oldProps) {
  // 기존 속성들 제거/업데이트
  if (oldProps) {
    Object.keys(oldProps).forEach((key) => {
      if (!(key in (newProps || {}))) {
        // 새 props에 없는 속성 제거
        if (key.startsWith("on") && typeof oldProps[key] === "function") {
          const eventType = key.slice(2).toLowerCase();
          removeEvent(target, eventType, oldProps[key]);
        } else if (key === "className") {
          target.removeAttribute("class");
        } else if (typeof oldProps[key] === "boolean") {
          target.removeAttribute(key);
          if (key in target) {
            target[key] = false;
          }
        } else {
          target.removeAttribute(key);
        }
      }
    });
  }

  // 새 속성들 추가/업데이트
  if (newProps) {
    Object.entries(newProps).forEach(([key, value]) => {
      const oldValue = oldProps?.[key];

      if (value === oldValue) return; // 동일하면 스킵

      // 이벤트 핸들러 처리
      if (key.startsWith("on") && typeof value === "function") {
        const eventType = key.slice(2).toLowerCase();
        if (oldValue) {
          removeEvent(target, eventType, oldValue);
        }
        addEvent(target, eventType, value);
        return;
      }

      // className 처리
      if (key === "className") {
        if (value) {
          target.setAttribute("class", value);
        } else {
          target.removeAttribute("class");
        }
        return;
      }

      // 불리언 속성 처리
      if (typeof value === "boolean") {
        if (key === "checked" || key === "selected") {
          // JavaScript 속성만 사용
          target[key] = value;
        } else if (key === "readOnly") {
          // readOnly → readonly 변환
          if (value) {
            target.setAttribute("readonly", "");
            target.readOnly = true;
          } else {
            target.removeAttribute("readonly");
            target.readOnly = false;
          }
        } else {
          // 일반 Boolean 속성 (disabled, hidden 등)
          if (value) {
            target.setAttribute(key, "");
            if (key in target) {
              target[key] = true;
            }
          } else {
            target.removeAttribute(key);
            if (key in target) {
              target[key] = false;
            }
          }
        }
        return;
      }

      // 일반 속성 처리
      if (value != null) {
        target.setAttribute(key, value);
      } else {
        target.removeAttribute(key);
      }
    });
  }
}

/**
 * Virtual DOM diff 및 업데이트
 */
export function updateElement(parentElement, newNode, oldNode, index = 0) {
  // 1. oldNode가 없으면 새 노드 추가
  if (!oldNode) {
    if (newNode && newNode !== "") {
      const element = createElement(newNode);
      const referenceNode = parentElement.childNodes[index];
      if (referenceNode) {
        parentElement.insertBefore(element, referenceNode);
      } else {
        parentElement.appendChild(element);
      }
    }
    return;
  }

  // 2. newNode가 없으면 기존 노드 제거
  if (!newNode || newNode === "") {
    const childNode = parentElement.childNodes[index];
    if (childNode) {
      parentElement.removeChild(childNode);
    }
    return;
  }

  // 3. 텍스트 노드 처리
  if (typeof newNode === "string" || typeof newNode === "number") {
    const newText = String(newNode);
    const oldText = String(oldNode);

    if (newText !== oldText) {
      const targetNode = parentElement.childNodes[index];
      if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
        targetNode.textContent = newText;
      } else {
        const textNode = document.createTextNode(newText);
        if (targetNode) {
          parentElement.replaceChild(textNode, targetNode);
        } else {
          parentElement.appendChild(textNode);
        }
      }
    }
    return;
  }

  // 4. 배열 처리
  if (Array.isArray(newNode) || Array.isArray(oldNode)) {
    const newChildren = Array.isArray(newNode) ? newNode : [newNode];
    const oldChildren = Array.isArray(oldNode) ? oldNode : [oldNode];
    const maxLength = Math.max(newChildren.length, oldChildren.length);

    for (let i = 0; i < maxLength; i++) {
      // 수정: index + i 대신 i를 사용 (배열 자체가 하나의 단위)
      updateElement(parentElement, newChildren[i], oldChildren[i], i);
    }
    return;
  }

  // 5. 노드 타입이 다르면 교체
  if (newNode.type !== oldNode.type) {
    const newElement = createElement(newNode);
    const targetNode = parentElement.childNodes[index];
    if (targetNode) {
      parentElement.replaceChild(newElement, targetNode);
    } else {
      parentElement.appendChild(newElement);
    }
    return;
  }

  // 6. 같은 타입이면 속성만 업데이트
  const targetElement = parentElement.childNodes[index];
  if (targetElement && targetElement.nodeType === Node.ELEMENT_NODE) {
    updateAttributes(targetElement, newNode.props, oldNode.props);

    // 7. 자식 노드들 재귀적으로 업데이트
    const newChildren = newNode.children || [];
    const oldChildren = oldNode.children || [];
    const maxLength = Math.max(newChildren.length, oldChildren.length);

    // 수정: 정순으로 처리하되, 제거는 역순으로
    for (let i = 0; i < maxLength; i++) {
      updateElement(targetElement, newChildren[i], oldChildren[i], i);
    }

    // 불필요한 자식 노드 제거 (역순으로)
    while (targetElement.childNodes.length > newChildren.length) {
      targetElement.removeChild(targetElement.lastChild);
    }
  }
}

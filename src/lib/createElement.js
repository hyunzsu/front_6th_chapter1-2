import { addEvent } from "./eventManager";

/**
 * vNode를 실제 DOM 요소로 변환
 */
export function createElement(vNode) {
  // 1. null, undefined, boolean 처리 -> 빈 텍스트 노드
  if (vNode == null || typeof vNode === "boolean") {
    return document.createTextNode("");
  }

  // 2. 문자열, 숫자 처리 -> 텍스트 노드
  if (typeof vNode === "string" || typeof vNode === "number") {
    return document.createTextNode(String(vNode));
  }

  // 3. 배열 처리 -> DocumentFragment
  if (Array.isArray(vNode)) {
    const fragment = document.createDocumentFragment();
    vNode.forEach((child) => {
      const childElement = createElement(child);
      fragment.appendChild(childElement);
    });
    return fragment;
  }

  // 4. 함수 컴포넌트 처리 -> 에러 발생
  if (typeof vNode.type === "function") {
    throw new Error("함수 컴포넌트는 정규화 후에 createElement를 호출해야 합니다.");
  }

  // 5. HTML 요소 처리
  const element = document.createElement(vNode.type);

  // 속성 설정
  if (vNode.props) {
    updateAttributes(element, vNode.props);
  }

  // 자식 요소 추가
  if (vNode.children) {
    vNode.children.forEach((child) => {
      const childElement = createElement(child);
      element.appendChild(childElement);
    });
  }

  return element;
}

/**
 * 요소의 속성을 업데이트
 */
function updateAttributes($el, props) {
  Object.entries(props).forEach(([key, value]) => {
    // 이벤트 핸들러 처리
    if (key.startsWith("on") && typeof value === "function") {
      const eventType = key.slice(2).toLowerCase(); // onClick -> click
      addEvent($el, eventType, value);
      return;
    }

    // className 처리
    if (key === "className") {
      if (value) {
        $el.setAttribute("class", value);
      }
      return;
    }

    // 불리언 속성 처리 (checked, disabled, selected 등)
    if (typeof value === "boolean") {
      if (value) {
        // checked와 selected는 attribute 없이 property만 설정
        if (key === "checked" || key === "selected") {
          $el[key] = true;
        } else {
          $el.setAttribute(key, "");
          if (key in $el) {
            $el[key] = true;
          }
        }
      } else {
        // false일 때는 attribute와 property 모두 제거/false 설정
        $el.removeAttribute(key);
        if (key in $el) {
          $el[key] = false;
        }
      }
      return;
    }

    // data-* 속성 처리
    if (key.startsWith("data-")) {
      $el.setAttribute(key, value);
      return;
    }

    // 일반 속성 처리
    if (value != null) {
      $el.setAttribute(key, value);
    }
  });
}

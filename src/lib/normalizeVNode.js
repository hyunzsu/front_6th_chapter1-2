export function normalizeVNode(vNode) {
  // 1. 렌더링되지 않는 값들 처리
  if (vNode == null || typeof vNode === "boolean") {
    return "";
  }

  // 2. 원시 타입 처리
  if (typeof vNode === "string" || typeof vNode === "number") {
    return String(vNode);
  }

  // 3. 배열 처리
  if (Array.isArray(vNode)) {
    return vNode.length === 0 ? "" : vNode.map((child) => normalizeVNode(child));
  }

  // 4. 일반 객체 처리
  if (typeof vNode === "object" && !vNode.type) {
    return "";
  }

  // 5. 함수 컴포넌트 처리
  if (typeof vNode.type === "function") {
    const props = {
      ...vNode.props,
      children: vNode.children,
    };
    const result = vNode.type(props);
    return normalizeVNode(result);
  }

  // 6. HTML 엘리먼트 처리
  return {
    ...vNode,
    children: (vNode.children || [])
      .map((child) => normalizeVNode(child))
      .filter((child) => child !== "" && child != null),
  };
}

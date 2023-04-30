export const SORRY = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      style={{ overflow: "visible" }}
    >
      <circle cx="50" cy="50" r="50" fill="transparent">
        <animate
          attributeName="fill"
          from="transparent"
          to="#ffc10714"
          dur="1s"
          begin="0s"
          repeatCount="1"
          fill="freeze"
        />
      </circle>

      <g>
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="#795548ad"
          strokeOpacity="0"
          strokeDasharray="4"
        >
          <animate
            attributeName="stroke-opacity"
            to="0.8"
            dur="2s"
            begin="0s"
            repeatCount="1"
            fill="freeze"
          />
        </line>

        <circle cx="100" cy="50" r="3" fill="green">
          <animate
            attributeName="cx"
            dur="6s"
            begin="2s"
            calcMode="spline"
            repeatCount="indefinite"
            values="100;0;100"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <animate
            attributeName="cy"
            dur="6s"
            begin="2s"
            calcMode="spline"
            repeatCount="indefinite"
            values="50;50;50"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </circle>
      </g>

      <g>
        <line
          x1="50"
          y1="0"
          x2="50"
          y2="100"
          stroke="#795548ad"
          strokeOpacity="0"
          strokeDasharray="4"
        >
          <animate
            attributeName="stroke-opacity"
            to="0.8"
            dur="2s"
            begin="0s"
            repeatCount="1"
            fill="freeze"
          />
        </line>

        <circle cx="50" cy="100" r="3" fill="red">
          <animate
            attributeName="cx"
            dur="6s"
            begin="6.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="50;50;50"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <animate
            attributeName="cy"
            dur="6s"
            begin="6.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="100;0;100"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </circle>
      </g>

      <g id="135deg">
        <line
          x1="14.64"
          y1="14.64"
          x2="85.35"
          y2="85.35"
          stroke="#795548ad"
          strokeOpacity="0"
          strokeDasharray="4"
        >
          <animate
            attributeName="stroke-opacity"
            to="0.8"
            dur="2s"
            begin="0s"
            repeatCount="1"
            fill="freeze"
          />
        </line>

        <circle cx="85.35" cy="85.35" r="3" fill="blue">
          <animate
            attributeName="cx"
            dur="6s"
            begin="7.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="85.35;14.64;85.35"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <animate
            attributeName="cy"
            dur="6s"
            begin="7.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="85.35;14.64;85.35"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </circle>
      </g>

      <g id="45deg">
        <line
          x1="85.35"
          y1="14.64"
          x2="14.64"
          y2="85.35"
          stroke="#795548ad"
          strokeOpacity="0"
          strokeDasharray="4"
        >
          <animate
            attributeName="stroke-opacity"
            to="0.8"
            dur="2s"
            begin="0s"
            repeatCount="1"
            fill="freeze"
          />
        </line>

        <circle cx="85.35" cy="14.64" r="3" fill="orange">
          <animate
            attributeName="cx"
            dur="6s"
            begin="8.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="85.35;14.64;85.35"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
          <animate
            attributeName="cy"
            dur="6s"
            begin="8.5s"
            calcMode="spline"
            repeatCount="indefinite"
            values="14.64;85.35;14.64"
            keyTimes="0;0.5;1"
            keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          />
        </circle>
      </g>
    </svg>
  );
};

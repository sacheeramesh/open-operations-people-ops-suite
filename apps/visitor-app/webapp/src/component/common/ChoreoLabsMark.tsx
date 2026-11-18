/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/**
 * The Choreo Labs mark: nine dots in an open ring.
 *
 * The ellipses are copied unchanged from the brand's icon artwork, whose
 * viewBox is trimmed to the dots, so the rendered height is the mark height
 * the lockup spec sizes. Filled with the current text colour so it always
 * matches the wordmark beside it: Midnight Ink on light, white on dark.
 *
 * Sized by CSS rather than props: set a height and the width follows from the
 * aspect ratio.
 */
interface ChoreoLabsMarkProps {
  /** Lets `Box component={ChoreoLabsMark} sx={…}` size and place it. */
  className?: string;
}

const VIEW_BOX_WIDTH = 844.97;
const VIEW_BOX_HEIGHT = 887.42;

const DOTS: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 710.09, cy: 282.87, rx: 134.88, ry: 60.8 },
  { cx: 629.81, cy: 135.53, rx: 129.85, ry: 51.34 },
  { cx: 470.02, cy: 24.5, rx: 141.63, ry: 24.5 },
  { cx: 710.09, cy: 604.55, rx: 134.88, ry: 60.8 },
  { cx: 629.81, cy: 751.87, rx: 129.85, ry: 51.34 },
  { cx: 470.02, cy: 862.91, rx: 141.63, ry: 24.5 },
  { cx: 134.88, cy: 430.4, rx: 134.88, ry: 60.8 },
  { cx: 181.78, cy: 607.8, rx: 110.13, ry: 51.34 },
  { cx: 181.78, cy: 252.45, rx: 110.13, ry: 51.34 },
];

export default function ChoreoLabsMark({ className }: ChoreoLabsMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_BOX_WIDTH} ${VIEW_BOX_HEIGHT}`}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ aspectRatio: `${VIEW_BOX_WIDTH} / ${VIEW_BOX_HEIGHT}`, width: "auto" }}
    >
      {DOTS.map(({ cx, cy, rx, ry }) => (
        <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} />
      ))}
    </svg>
  );
}

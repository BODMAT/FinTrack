/// <reference types="vite-plugin-svgr/client" />

declare module "*.svg?react" {
	import * as React from "react";
	const content: React.FC<React.SVGProps<SVGSVGElement>>;
	export default content;
}

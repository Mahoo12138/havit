
# Web 前端规则

- 使用 React + TypeScript，不使用 tailwindcss，使用 vanilla-extract。
- UI 优先复用 `src/components/ui`，如果没有需要指出，人工手动去 shadcn 进行复制，然后执行类型迁移。
- 不要直接写内联样式，使用 vanilla-extract 编写样式，组件使用单文件。
- 页面必须考虑响应式适配，移动端适配采取 useDevice 区分组件渲染。
- 表单优先使用项目已有的表单封装。

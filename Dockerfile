# ------------ 构建阶段 ------------

## 使用Node.js 22 slim 作为构建基础镜像
FROM node:22-slim AS build

## 设置工作目录
WORKDIR /app

## 安装pnpm
RUN npm install -g pnpm@10

## 复制依赖相关文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

## 安装依赖
RUN pnpm install --frozen-lockfile

## 复制所有文件
COPY . .

## 构建应用
RUN pnpm build

# ------------ 运行阶段 ------------

## 使用nginx stable-alpine作为运行时基础镜像
FROM nginx:stable-alpine AS production

## 复制构建产物到nginx服务目录
COPY --from=build /app/dist /usr/share/nginx/html

## 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

## 暴露nginx容器80端口
EXPOSE 80

## 启动nginx
CMD ["nginx", "-g", "daemon off;"]

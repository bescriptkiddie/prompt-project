# 部署指南 - 腾讯云服务器

本项目支持使用 Docker 容器化部署，这是最推荐的方式，可以确保环境一致性并简化部署流程。

由于本项目包含 **API 路由 (Server-side API)**，不能仅打包为静态 HTML 文件（dist），必须运行在 Node.js 环境中。Docker 方案已为您处理好了这一切。

## 准备工作

1.  **服务器环境**：

    - 确保您的腾讯云服务器（CVM）已安装 **Docker** 和 **Docker Compose**。
    - 如果尚未安装，可以参考腾讯云官方文档或使用以下命令（以 CentOS/Ubuntu 为例）：

      ```bash
      # 安装 Docker
      curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

      # 启动 Docker
      sudo systemctl start docker
      sudo systemctl enable docker

      # 安装 Docker Compose (如果 docker compose 命令不可用)
      # 较新版本的 Docker 已经内置了 docker compose 插件，直接使用 'docker compose' 即可
      ```

2.  **代码上传**：
    - 您可以使用 `git` 拉取代码，或者使用 `scp` / SFTP 将本地项目代码上传到服务器。

## 部署步骤

### 方法一：使用 Docker Compose (推荐)

这种方式会直接在服务器上进行构建（Build）和运行，您**不需要**在本地手动打包 dist。

1.  **进入项目目录**：

    ```bash
    cd /path/to/your/project/prompt-project
    ```

2.  **构建并启动服务**：

    ```bash
    # 构建镜像并后台启动
    docker compose up -d --build
    ```

3.  **查看状态**：

    ```bash
    docker compose ps
    ```

    如果状态为 `Up`，说明服务启动成功。

4.  **访问应用**：

    - 在浏览器中访问 `http://<您的服务器IP>` (默认 80 端口)。
    - 如果无法访问，请检查腾讯云控制台的**安全组**设置，确保 **80** 端口已对入站流量开放。
    - 如果您有域名，可以将域名解析到服务器 IP，并修改 `nginx/conf.d/default.conf` 中的 `server_name`。

5.  **停止服务**：
    ```bash
    docker compose down
    ```

### 方法二：本地构建 Standalone 包 (适用于服务器配置较低的情况)

如果您的服务器内存较小（如 1G 或 2G），在服务器上直接构建可能会导致内存不足（OOM）。此时可以选择在本地电脑打包，然后上传到服务器运行。

1.  **本地构建**：
    在本地项目根目录运行：

    ```bash
    npm run build
    ```

    构建完成后，会生成 `.next/standalone` 文件夹。这是 Next.js 自动生成的最小化独立运行包。

2.  **准备上传文件**：
    您需要上传以下文件/文件夹到服务器的同一个目录（例如 `/app/prompt-project`）：

    - `.next/standalone/` 文件夹内的所有内容 **复制出来** 到根目录
    - `.next/static/` 文件夹 **复制到** `standalone/.next/static/`
    - `public/` 文件夹 **复制到** `standalone/public/`

    _更简单的做法是，直接把本地的 `.next/standalone` 文件夹，加上 `.next/static` 和 `public` 文件夹一起打包压缩，上传到服务器解压。_

3.  **在服务器运行**：
    确保服务器安装了 Node.js (v18+)。

    ```bash
    # 进入解压后的目录
    cd /path/to/uploaded/files

    # 运行服务
    node server.js
    ```

    _注意：这种方式不使用 Docker，需要您自己在服务器安装 Node.js 环境，或者配合 PM2 进行进程管理。_

## 环境变量配置

如果您的应用需要 API Key（如 OpenAI Key 等），建议创建一个 `.env.production` 文件，并在 `docker-compose.yml` 中引用，或者直接在 `docker-compose.yml` 的 `environment` 部分添加：

```yaml
environment:
  - NODE_ENV=production
  - OPENAI_API_KEY=your_key_here
```

## 常见问题

- **为什么不能像 Vue/React 那样只打包一个 dist 文件夹？**
  - 本项目使用了 Next.js 的 **API Routes** 功能（在 `/api` 目录下），这意味着它不仅是前端页面，还包含后端服务（如处理图片上传、调用 AI 接口）。因此，它必须运行在一个 Node.js 服务器上，而不能仅仅作为静态文件托管在 Nginx 下。
- **端口冲突**：如果 3000 端口已被占用，请修改 `docker-compose.yml` 中的端口映射，例如 `"8080:3000"`，然后通过 8080 端口访问。
- **构建失败**：请检查服务器内存是否充足。Next.js 构建过程可能需要较多内存。如果内存不足，建议在本地构建好镜像后推送到镜像仓库（如腾讯云 TCR），然后在服务器上拉取运行。

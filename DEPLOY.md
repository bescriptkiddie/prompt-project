# 部署指南 - 腾讯云服务器

本项目支持使用 Docker 容器化部署，这是最推荐的方式，可以确保环境一致性并简化部署流程。

## 准备工作

1.  **服务器环境**：
    *   确保您的腾讯云服务器（CVM）已安装 **Docker** 和 **Docker Compose**。
    *   如果尚未安装，可以参考腾讯云官方文档或使用以下命令（以 CentOS/Ubuntu 为例）：
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
    *   您可以使用 `git` 拉取代码，或者使用 `scp` / SFTP 将本地项目代码上传到服务器。

## 部署步骤

### 方法一：使用 Docker Compose (推荐)

1.  **进入项目目录**：
    ```bash
    cd /path/to/your/project/pet-emoji
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
    *   在浏览器中访问 `http://<您的服务器IP>:3000`。
    *   如果无法访问，请检查腾讯云控制台的**安全组**设置，确保 **3000** 端口已对入站流量开放。

5.  **停止服务**：
    ```bash
    docker compose down
    ```

### 方法二：手动构建 Docker 镜像

如果您不想使用 Docker Compose，也可以手动构建和运行：

1.  **构建镜像**：
    ```bash
    docker build -t pet-emoji-app .
    ```

2.  **运行容器**：
    ```bash
    docker run -d -p 3000:3000 --name pet-emoji-container pet-emoji-app
    ```

## 环境变量配置

如果您的应用需要 API Key（如 OpenAI Key 等），建议创建一个 `.env.production` 文件，并在 `docker-compose.yml` 中引用，或者直接在 `docker-compose.yml` 的 `environment` 部分添加：

```yaml
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=your_key_here
```

## 常见问题

*   **端口冲突**：如果 3000 端口已被占用，请修改 `docker-compose.yml` 中的端口映射，例如 `"8080:3000"`，然后通过 8080 端口访问。
*   **构建失败**：请检查服务器内存是否充足。Next.js 构建过程可能需要较多内存。如果内存不足，建议在本地构建好镜像后推送到镜像仓库（如腾讯云 TCR），然后在服务器上拉取运行。

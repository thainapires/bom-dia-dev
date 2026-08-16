FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates python3 make g++ \
    && GLAB_VERSION=$(curl -sI https://gitlab.com/gitlab-org/cli/-/releases/permalink/latest | grep -i '^location:' | sed -E 's#.*/v##; s#\r##') \
    && curl -fsSL "https://gitlab.com/gitlab-org/cli/-/releases/v${GLAB_VERSION}/downloads/glab_${GLAB_VERSION}_linux_amd64.deb" -o /tmp/glab.deb \
    && apt-get install -y --no-install-recommends /tmp/glab.deb \
    && rm /tmp/glab.deb \
    && apt-get purge -y curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]

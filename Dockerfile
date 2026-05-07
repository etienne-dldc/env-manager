FROM denoland/deno:2.7.13

WORKDIR /app

COPY . .

# Pre-cache remote dependencies at build time to speed up startup.
RUN deno cache main.tsx

ENV PORT=3000
ENV OTEL_DENO=true
ENV OTEL_SERVICE_NAME=env-manager
EXPOSE 3000

CMD ["run", "--allow-net", "--allow-env", "--allow-read=/app,/data", "--allow-write=/data", "--no-prompt", "main.tsx"]

# builds and pushes a new version of the image to dockerhub
docker buildx build --platform linux/amd64,linux/arm64 --push -t screeny05/letterboxd-list-radarr:$1 .
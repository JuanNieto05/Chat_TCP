FROM openjdk:21-slim

WORKDIR /app

# Copiar solo lo necesario
COPY build.gradle settings.gradle ./
COPY server/ ./server/
COPY gradlew ./
COPY gradle/ ./gradle/

# Dar permisos de ejecución
RUN chmod +x ./gradlew

# Instalar dependencias y construir
RUN ./gradlew :server:build -x test

# Exponer puertos múltiples
EXPOSE 10000 6000 12345

# Comando de inicio
CMD ["./gradlew", ":server:run"]
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Dar permisos de ejecución a gradlew
RUN chmod +x ./gradlew

# Instalar dependencias y construir (saltar tests temporalmente)
RUN ./gradlew :server:build -x test

# Exponer SOLO el puerto principal ICE
EXPOSE 10000

# Comando de inicio
CMD ["./gradlew", ":server:run"]
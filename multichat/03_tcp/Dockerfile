FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Dar permisos de ejecución a gradlew
RUN chmod +x ./gradlew

# Limpiar y construir
RUN ./gradlew clean :server:build -x test

# Exponer puerto ICE
EXPOSE 10000

# Comando de inicio
CMD ["./gradlew", ":server:run"]
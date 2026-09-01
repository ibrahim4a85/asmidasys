# ==== منصة ERP السحابية — حزمة نشر Docker بضغطة واحدة ====
# تُبني الواجهة ثم الخادم، وتُشغَّل معاً في حاوية واحدة (Node 22).

# ---- مرحلة البناء ----
FROM node:22-alpine AS build
WORKDIR /app

# تثبيت الاعتماديات أولاً للاستفادة من الكاش
COPY package.json package-lock.json* ./
RUN npm install

COPY . .
# بناء الواجهة (dist/) والخادم (dist-server/)
RUN npm run build

# ---- مرحلة التشغيل ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

# أفضل ممارسة: إنشاء مستخدم غير جذر
RUN addgroup -S app && adduser -S app -G app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server

# مجلدات بيانات قابلة للتحميل (volume)
RUN mkdir -p /app/data /app/uploads && chown -R app:app /app

USER app
EXPOSE 3001

# يعمل كشبكة SPA + API في نفس المنفذ
CMD ["node", "dist-server/index.js"]

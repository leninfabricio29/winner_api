# Elicitación de Requerimientos — Sistema de Puntos y Lugares

> **Instrucción para el modelo:** Con base en este documento, elabora una API REST completa usando **TypeScript**, **Node.js**, **Express** y **MongoDB (Mongoose)**. Genera los modelos, rutas, controladores y middlewares necesarios. Sigue las convenciones REST, usa async/await, manejo de errores centralizado y JWT para autenticación. Estructura el proyecto con separación de capas: `models/`, `controllers/`, `routes/`, `middlewares/`, `services/`.

---

## 1. Visión General del Sistema

Plataforma de fidelización geolocalizada donde:
- **Business** registra lugares y crea promociones.
- **Client** acumula puntos por visitas, reseñas y referidos, y los canjea en promociones.
- **Super Admin** administra usuarios, categorías y las fuentes de puntos de forma dinámica.

**Stack requerido:**
- Runtime: Node.js + TypeScript
- Framework: Express.js
- Base de datos: MongoDB con Mongoose
- Autenticación: JWT (jsonwebtoken)
- Validación: Zod o class-validator
- Hash de contraseñas: bcrypt

---

## 2. Actores y Roles

| Rol | Descripción |
|---|---|
| `super_admin` | Control total del sistema. Gestiona fuentes de puntos, categorías y usuarios. |
| `business` | Registra su negocio, crea lugares y promociones, valida códigos de canje. |
| `client` | Visita lugares, deja reseñas, gana puntos, canjea promociones. |

---

## 3. Modelos de Datos (Mongoose + TypeScript)

### 3.1 User

Modelo unificado con discriminación por rol.

```typescript
interface IUser {
  _id: ObjectId;
  first_name: string;           // requerido
  last_name: string;            // requerido
  email: string;                // único, requerido
  password: string;             // hash bcrypt
  phone: string;                // requerido
  role: 'super_admin' | 'business' | 'client';
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;

  // Solo para role === 'client'
  ci?: string;                  // cédula de identidad
  referral_code?: string;       // único, generado al registrarse
  referral_used?: string;       // código de referido que usó al registrarse
  points_balance?: number;      // saldo actual de puntos (default: 0)

  // Solo para role === 'business'
  ruc?: string;                 // RUC del negocio
  business_name?: string;       // nombre del negocio
  business_category?: string;   // categoría del negocio (texto libre o referencia)
}
```

### 3.2 Place (Lugar)

```typescript
interface IPlace {
  _id: ObjectId;
  name: string;
  description: string;
  category_id: ObjectId;        // ref: PlaceCategory
  business_id: ObjectId;        // ref: User (role: business)
  location: {
    type: 'Point';              // GeoJSON para búsquedas geoespaciales
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  images: string[];             // URLs de imágenes
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
// Índice: { location: '2dsphere' }
```

### 3.3 PlaceCategory (Categoría de lugar)

```typescript
interface IPlaceCategory {
  _id: ObjectId;
  name: string;                 // ej: "Restaurante", "Parque", "Gimnasio"
  icon?: string;                // URL o nombre de ícono
  status: 'active' | 'inactive';
  createdAt: Date;
}
```

### 3.4 Promotion (Promoción)

```typescript
interface IPromotion {
  _id: ObjectId;
  title: string;
  description?: string;
  image: string;                // URL de imagen
  place_id: ObjectId;           // ref: Place
  business_id: ObjectId;        // ref: User (role: business), desnormalizado
  points_required: number;      // puntos necesarios para canjear
  start_date: Date;
  end_date: Date;
  max_claims_per_user: number;  // máximo de canjes por usuario
  total_max_claims?: number;    // límite global (null = ilimitado)
  total_claimed: number;        // contador global de canjes (default: 0)
  status: 'active' | 'inactive' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.5 Redemption (Canje)

```typescript
interface IRedemption {
  _id: ObjectId;
  client_id: ObjectId;          // ref: User (role: client)
  promotion_id: ObjectId;       // ref: Promotion
  business_id: ObjectId;        // ref: User (role: business)
  points_spent: number;         // puntos descontados al momento del canje
  redemption_code: string;      // código único generado (ej: UUID corto)
  status: 'pending' | 'validated' | 'expired';
  validated_at?: Date;          // fecha en que el business validó el código
  expires_at: Date;             // expiración del código (ej: 24 horas)
  createdAt: Date;
}
```

### 3.6 PointSource (Fuente de puntos — gestionable)

```typescript
interface IPointSource {
  _id: ObjectId;
  name: string;                 // nombre legible: "Visita a lugar"
  code: 'VISIT' | 'REVIEW' | 'REFERRAL_SENDER' | 'REFERRAL_RECEIVER' | 'REGISTRATION';
  points: number;               // valor de puntos a otorgar
  is_active: boolean;           // el super admin puede activar/desactivar
  description?: string;         // descripción interna
  updatedAt: Date;
}
```

### 3.7 PointTransaction (Historial de puntos)

```typescript
interface IPointTransaction {
  _id: ObjectId;
  client_id: ObjectId;          // ref: User (role: client)
  source_code: string;          // copia del PointSource.code
  points: number;               // positivo = ganado, negativo = descontado
  reference_id?: ObjectId;      // ref: Place | Promotion | Redemption según el caso
  description: string;          // descripción legible de la transacción
  createdAt: Date;
}
```

### 3.8 Review (Reseña)

```typescript
interface IReview {
  _id: ObjectId;
  client_id: ObjectId;          // ref: User (role: client)
  place_id: ObjectId;           // ref: Place
  rating: number;               // 1 a 5
  comment?: string;
  points_awarded: boolean;      // si ya se otorgaron puntos por esta reseña
  createdAt: Date;
}
// Restricción: un client solo puede hacer una review por place
```

### 3.9 Visit (Visita registrada)

```typescript
interface IVisit {
  _id: ObjectId;
  client_id: ObjectId;          // ref: User (role: client)
  place_id: ObjectId;           // ref: Place
  points_awarded: boolean;
  createdAt: Date;
}
```

### 3.10 Favorite (Lugar favorito)

```typescript
interface IFavorite {
  _id: ObjectId;
  client_id: ObjectId;          // ref: User (role: client)
  place_id: ObjectId;           // ref: Place
  createdAt: Date;
}
// Índice compuesto único: { client_id: 1, place_id: 1 }
```

---

## 4. Endpoints REST Requeridos

> Convención de prefijo base: `/api/v1`

### 4.1 Auth (`/auth`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/auth/register/client` | Registro de cliente (con referral_code opcional) | público |
| POST | `/auth/register/business` | Registro de negocio | público |
| POST | `/auth/login` | Login unificado por email+password | público |
| POST | `/auth/forgot-password` | Solicitar recuperación de contraseña por email | público |
| POST | `/auth/reset-password` | Resetear contraseña con token | público |
| PUT | `/auth/change-password` | Cambiar contraseña (autenticado) | client, business |

**Request body `/auth/register/client`:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "ci": "string",
  "referral_code_used": "string (opcional)"
}
```

**Request body `/auth/register/business`:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "ruc": "string",
  "business_name": "string",
  "business_category": "string"
}
```

**Response `/auth/login`:**
```json
{
  "token": "JWT",
  "user": { "_id": "", "email": "", "role": "", "first_name": "", "last_name": "" }
}
```

---

### 4.2 Users (`/users`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/users/me` | Obtener perfil propio | client, business |
| PUT | `/users/me` | Editar perfil propio | client, business |
| GET | `/users` | Listar todos los usuarios (paginado) | super_admin |
| GET | `/users/:id` | Ver usuario por ID | super_admin |
| PUT | `/users/:id/status` | Suspender o activar usuario | super_admin |
| DELETE | `/users/:id` | Eliminar usuario (soft delete) | super_admin |

---

### 4.3 Place Categories (`/categories`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/categories` | Listar categorías activas | público |
| POST | `/categories` | Crear categoría | super_admin |
| PUT | `/categories/:id` | Editar categoría | super_admin |
| DELETE | `/categories/:id` | Desactivar categoría | super_admin |

---

### 4.4 Places (`/places`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/places` | Listar lugares (con filtros: categoría, búsqueda, estado) | público |
| GET | `/places/:id` | Ver detalle de un lugar | público |
| POST | `/places` | Crear lugar | business |
| PUT | `/places/:id` | Editar lugar propio | business |
| DELETE | `/places/:id` | Desactivar lugar propio | business |
| GET | `/places/nearby` | Buscar lugares cercanos (lat, lng, radius) | público |
| GET | `/places/my` | Ver mis lugares | business |

**Query params `/places`:** `?category=&search=&status=&page=&limit=`

**Query params `/places/nearby`:** `?lat=&lng=&radius=1000` (radio en metros)

---

### 4.5 Promotions (`/promotions`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/promotions` | Listar promociones activas | público |
| GET | `/promotions/:id` | Ver detalle de promoción | público |
| POST | `/promotions` | Crear promoción (asociada a un lugar propio) | business |
| PUT | `/promotions/:id` | Editar promoción propia | business |
| DELETE | `/promotions/:id` | Desactivar promoción | business |
| GET | `/promotions/my` | Ver mis promociones | business |

---

### 4.6 Redemptions (`/redemptions`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/redemptions` | Canjear una promoción (genera código de canje) | client |
| GET | `/redemptions/my` | Historial de canjes del cliente | client |
| POST | `/redemptions/validate` | Validar código de canje ingresado por el business | business |
| GET | `/redemptions/business` | Ver canjes validados en mis lugares | business |

**Request body `POST /redemptions`:**
```json
{ "promotion_id": "ObjectId" }
```

**Response `POST /redemptions`:**
```json
{
  "redemption_code": "ABCD-1234",
  "expires_at": "ISO date",
  "promotion": { "title": "", "points_required": 0 }
}
```

**Request body `POST /redemptions/validate`:**
```json
{ "redemption_code": "ABCD-1234" }
```

---

### 4.7 Visits (`/visits`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/visits` | Registrar visita a un lugar | client |
| GET | `/visits/my` | Historial de visitas del cliente | client |

**Request body `POST /visits`:**
```json
{ "place_id": "ObjectId" }
```

**Lógica:** Al crear la visita, consultar si `PointSource` con `code: 'VISIT'` está activo. Si sí, crear `PointTransaction` positiva y sumar al `points_balance` del cliente.

---

### 4.8 Reviews (`/reviews`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/reviews` | Dejar reseña en un lugar | client |
| GET | `/reviews/place/:placeId` | Ver reseñas de un lugar | público |
| DELETE | `/reviews/:id` | Eliminar reseña propia | client |

**Request body `POST /reviews`:**
```json
{
  "place_id": "ObjectId",
  "rating": 4,
  "comment": "Excelente lugar"
}
```

**Lógica:** Un cliente solo puede dejar una reseña por lugar. Al crear, verificar que `PointSource` `REVIEW` esté activo y crear `PointTransaction`.

---

### 4.9 Favorites (`/favorites`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/favorites` | Listar lugares favoritos del cliente | client |
| POST | `/favorites` | Agregar lugar a favoritos | client |
| DELETE | `/favorites/:placeId` | Quitar lugar de favoritos | client |

---

### 4.10 Points (`/points`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/points/balance` | Ver saldo actual de puntos | client |
| GET | `/points/transactions` | Historial de transacciones (paginado) | client |

---

### 4.11 Point Sources (`/point-sources`)

| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/point-sources` | Listar todas las fuentes de puntos | super_admin |
| PUT | `/point-sources/:id` | Editar puntos o activar/desactivar una fuente | super_admin |

**Request body `PUT /point-sources/:id`:**
```json
{
  "points": 50,
  "is_active": true,
  "description": "Puntos por visita actualizado"
}
```

**Nota:** Las fuentes (`PointSource`) se crean con un seed inicial en la base de datos. El super admin solo puede editarlas, no crear ni eliminar.

**Seed inicial de PointSources:**
```json
[
  { "code": "VISIT", "name": "Visitar un lugar", "points": 10, "is_active": true },
  { "code": "REVIEW", "name": "Dejar una reseña", "points": 15, "is_active": true },
  { "code": "REFERRAL_SENDER", "name": "Referir a un nuevo usuario", "points": 20, "is_active": true },
  { "code": "REFERRAL_RECEIVER", "name": "Registrarse con código referido", "points": 10, "is_active": true },
  { "code": "REGISTRATION", "name": "Bono de registro", "points": 5, "is_active": false }
]
```

---

## 5. Lógicas de Negocio Clave

### 5.1 Lógica de referidos al registrar cliente

```
1. Cliente se registra con referral_code_used = "XYZ123"
2. Buscar en User donde referral_code === "XYZ123" y role === 'client'
3. Si existe el referente:
   a. PointSource REFERRAL_SENDER activo? → crear PointTransaction +N pts para el referente → actualizar su points_balance
   b. PointSource REFERRAL_RECEIVER activo? → crear PointTransaction +M pts para el nuevo cliente → actualizar su points_balance
4. Generar referral_code único para el nuevo cliente (ej: nanoid de 8 chars)
```

### 5.2 Lógica de canje de promoción

```
1. Cliente solicita canjear promotion_id
2. Verificar: promotion.status === 'active' && ahora entre start_date y end_date
3. Verificar: cliente tiene points_balance >= promotion.points_required
4. Verificar: canjes del cliente para esa promoción < promotion.max_claims_per_user
5. Verificar: promotion.total_claimed < promotion.total_max_claims (si aplica)
6. Crear Redemption con status: 'pending' y redemption_code único (UUID corto) con expires_at = now + 24h
7. Descontar puntos: PointTransaction negativa + actualizar points_balance
8. Incrementar promotion.total_claimed
9. Retornar el redemption_code al cliente
```

### 5.3 Lógica de validación de código de canje (Business)

```
1. Business ingresa redemption_code
2. Buscar Redemption donde redemption_code === code y business_id === business autenticado
3. Verificar status === 'pending' y expires_at > ahora
4. Actualizar status → 'validated', validated_at → ahora
5. Retornar confirmación
```

### 5.4 Expiración de códigos de canje (job periódico)

```
Cada hora (o con un índice TTL en MongoDB):
  Actualizar Redemption donde status === 'pending' y expires_at < ahora → status: 'expired'
  Devolver los puntos al cliente (crear PointTransaction positiva de reverso)
```

---

## 6. Middlewares Requeridos

```typescript
// authenticate: verifica JWT y adjunta req.user
// authorize(...roles): verifica que req.user.role esté en la lista permitida
// validate(schema): valida req.body con Zod

// Ejemplo de uso en rutas:
router.post('/places', authenticate, authorize('business'), validate(createPlaceSchema), createPlace);
router.put('/point-sources/:id', authenticate, authorize('super_admin'), validate(updatePointSourceSchema), updatePointSource);
```

---

## 7. Estructura de Proyecto Sugerida

```
src/
├── config/
│   ├── db.ts            # conexión MongoDB
│   └── env.ts           # variables de entorno
├── models/
│   ├── User.ts
│   ├── Place.ts
│   ├── PlaceCategory.ts
│   ├── Promotion.ts
│   ├── Redemption.ts
│   ├── PointSource.ts
│   ├── PointTransaction.ts
│   ├── Review.ts
│   ├── Visit.ts
│   └── Favorite.ts
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── place.controller.ts
│   ├── category.controller.ts
│   ├── promotion.controller.ts
│   ├── redemption.controller.ts
│   ├── visit.controller.ts
│   ├── review.controller.ts
│   ├── favorite.controller.ts
│   ├── points.controller.ts
│   └── pointSource.controller.ts
├── routes/
│   ├── index.ts         # agrega todas las rutas con prefijo /api/v1
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── place.routes.ts
│   ├── category.routes.ts
│   ├── promotion.routes.ts
│   ├── redemption.routes.ts
│   ├── visit.routes.ts
│   ├── review.routes.ts
│   ├── favorite.routes.ts
│   ├── points.routes.ts
│   └── pointSource.routes.ts
├── middlewares/
│   ├── authenticate.ts
│   ├── authorize.ts
│   ├── validate.ts
│   └── errorHandler.ts
├── services/
│   ├── points.service.ts     # lógica de otorgar/descontar puntos
│   ├── referral.service.ts   # lógica de referidos
│   └── redemption.service.ts # lógica de canje y validación
├── schemas/              # Zod schemas para validación
├── utils/
│   ├── generateReferralCode.ts
│   ├── generateRedemptionCode.ts
│   └── jwt.ts
├── seed/
│   └── pointSources.seed.ts
└── app.ts               # Express app entry point
```

---

## 8. Variables de Entorno (.env)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/puntos_lugares
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d
RESET_PASSWORD_EXPIRES_IN=1h
REDEMPTION_CODE_EXPIRES_HOURS=24
```

---

## 9. Respuestas HTTP Estándar

```typescript
// Éxito
{ "success": true, "data": { ... }, "message": "string (opcional)" }

// Error
{ "success": false, "message": "Descripción del error", "errors": [] }
```

| Código | Uso |
|---|---|
| 200 | OK — lectura/actualización exitosa |
| 201 | Created — recurso creado |
| 400 | Bad Request — validación fallida |
| 401 | Unauthorized — sin token o token inválido |
| 403 | Forbidden — rol no permitido |
| 404 | Not Found — recurso no existe |
| 409 | Conflict — duplicado (email ya registrado, review duplicada, etc.) |
| 500 | Internal Server Error |

---

## 10. Notas Adicionales para la Implementación

- Usar **Mongoose sessions/transactions** al descontar puntos y crear el Redemption para garantizar atomicidad.
- El campo `points_balance` en `User` debe actualizarse siempre junto con la creación de la `PointTransaction` correspondiente en la misma operación.
- Implementar un **índice TTL** en `Redemption` sobre `expires_at` con estado `pending` para auto-expirar, o un job con `node-cron`.
- La búsqueda geoespacial en `/places/nearby` requiere el índice `2dsphere` en `Place.location`.
- Los `referral_code` de clientes deben generarse con `nanoid` o similar, garantizando unicidad con índice único en MongoDB.
- El seed de `PointSource` debe ejecutarse una sola vez al iniciar la aplicación si la colección está vacía.
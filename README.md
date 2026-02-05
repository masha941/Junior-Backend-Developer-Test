# Grocery Store Management API

A Node.js/Express API for managing a hierarchical grocery store organization with role-based access control.

## Access Rules

- **Managers** can see and manage employees and managers in their node and all descendant nodes
- **Employees** can only see employees in their node and descendant nodes

## Setup

```bash
npm install

npm run seed

npm start

npm test
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Nodes
- `GET /api/nodes` - List accessible nodes
- `GET /api/nodes/:nodeId` - Get node details
- `GET /api/nodes/:nodeId/children` - Get direct children
- `GET /api/nodes/:nodeId/descendants` - Get all descendants
- `POST /api/nodes` - Create new node (managers only)
- `PUT /api/nodes/:nodeId` - Update node (managers only)
- `DELETE /api/nodes/:nodeId` - Delete node (managers only)

### Users
- `GET /api/nodes/:nodeId/employees` - Get employees for node
- `GET /api/nodes/:nodeId/employees?includeDescendants=true` - Include descendant nodes
- `GET /api/nodes/:nodeId/managers` - Get managers for node (managers only)
- `GET /api/nodes/:nodeId/users` - Get all users for node
- `POST /api/nodes/:nodeId/users` - Create user in node (managers only)
- `GET /api/nodes/users/:userId` - Get user details
- `PUT /api/nodes/users/:userId` - Update user (managers only)
- `DELETE /api/nodes/users/:userId` - Delete user (managers only)

## Test Credentials

After running `npm run seed`:
- CEO Manager: `petar_ceo` / `password123`
- Novi Beograd Manager: `jovan_novibeograd` / `password123`
- Employee: `dejan_emp_bezanija` / `password123`

## Environment Variables

Create a `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/grocery_store
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h
```
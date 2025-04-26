# Notification Service Issue Fix

The application is encountering errors with the notification service. The error log shows:

```
Failed to load resource: :5005/api/notifications/senddirect:1
the server responded with a status of 404 (Not Found)
```

## Root Cause:
1. Incorrect URL format in the notification service API calls
2. Error handling issues causing the UI to hang when notification requests fail

## Fix Steps:

### 1. Update Environment Variable
Make sure your `.env` file has the correct format for the notification service:

```
REACT_APP_NOTIFICATION_API_URL=http://localhost:5005/api
```

**Note**: This should not include `/notifications` in the URL as that's part of the route path.

### 2. Restart Services
Restart both your notification service and customer portal:

```bash
# Restart notification service
cd services/notification-service
npm run dev

# Restart customer portal
cd web/customer-portal
npm run dev
```

### 3. Verify API Endpoints
Verify that the notification service has the `/senddirect` endpoint:

1. Check `services/notification-service/src/routes/notificationRoutes.js`
2. It should contain: `router.post("/senddirect", notificationController.sendDirectNotification);`

If not, add the missing route.

### 4. Test Again
Try the payment process again. The buttons should now work properly even if the notification service is down.

## What Has Been Fixed:
1. Updated the API URL format in the notification service
2. Changed the endpoint path to `/notifications/senddirect`
3. Improved error handling in `PaymentSuccessPage.tsx`
4. Replaced Link components with buttons using programmatic navigation
5. Added timeout to API calls to prevent hanging requests
6. Modified the UI message to avoid mentioning email if the service is down 
// ============================================
// EXPO NOTIFICATIONS DISABLED - Save for Expo Go testing
// Re-enable for APK build
// ============================================

// 1. package.json - expo-notifications and expo-device REMOVED temporarily
//    Re-add before APK build:
//    "expo-notifications": "~0.31.0",
//    "expo-device": "~7.0.0"

// 2. Push notification code DISABLED in App.tsx
//    All registerForPushNotificationsAsync calls commented out
//    Notification listener stubs in place

// 3. To re-enable for APK build:
//    a. Add expo-notifications and expo-device back to package.json
//    b. Run: npm install
//    c. Uncomment push notification code in App.tsx
//    d. Remove stub functions

// STUB FUNCTION (currently active):
// const registerForPushNotificationsAsync=async(handler:any)=>{};
// notificationReceivedListener and notificationResponseListener are null

// FULL CODE TO RESTORE (from git before disable):
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
//
// async function registerForPushNotificationsAsync(handler:any){
//   if(!Device.isDevice){return}
//   const {status:existingStatus}=await Notifications.getPermissionsAsync();
//   let finalStatus=existingStatus;
//   if(existingStatus!=='granted'){
//     const {status}=await Notifications.requestPermissionsAsync();
//     finalStatus=status;
//   }
//   if(finalStatus!=='granted'){return}
//   const token=(await Notifications.getExpoPushTokenAsync({projectId:'659b4215-d07c-41f8-881b-c3e7cd7e951a'})).data;
//   if(Platform.OS==='android'){Notifications.setNotificationChannelAsync('default',{name:'default',importance:Notifications.AndroidImportance.MAX,vibrationPattern:[0,250,250,250],lightColor:'#FF231F7C'});}
//   const sub=Notifications.addNotificationReceivedListener(handler);
//   const resp=Notifications.addNotificationResponseReceivedListener((r)=>{
//     const url=r.notification.request.content.data?.url;
//     if(url)setScreen({type:'link',url});
//   });
//   return{sub,resp};
// }

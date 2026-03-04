# رسالة إلى Claude لحل مشكلة تسجيل دخول الأدمن

مرحباً Claude، 
لدي مشكلة في واجهة تسجيل دخول الأدمن في تطبيقي (React + Firebase). عندما أحاول تسجيل الدخول كأدمن، يقوم النظام بإخراجي فوراً وإعادتي لصفحة تسجيل الدخول، رغم أن حسابي مسجل بصلاحية `role: 'admin'` في قاعدة بيانات Firestore.

## تحليل المشكلة:
المشكلة تكمن في ملف `src/contexts/AuthContext.tsx`. نظام التحقق كان يعتمد **فقط** على وجود (Firebase Custom Claims) لمعرفة ما إذا كان المستخدم أدمن أم لا (`tokenResult.claims.admin === true`). بناءً على ذلك، عند استخدام دالة `signIn`، إذا لم يمتلك حساب الأدمن هذه الـ Custom Claims (لأنه تم إنشاؤه يدوياً أو بدون Cloud Function)، يتعامل معه الكود كطالب عادي ويتحقق من الـ `emailVerified`، مما يؤدي إلى فشل تسجيل الدخول وعمل `signOut` فوراً.

## التعديلات التي أريد تطبيقها لحل المشكلة:

### 1. تحديث دالة `isAdminUser`
لتشمل فحص قاعدة بيانات Firestore بالإضافة إلى Custom Claims، ولتكون بالشكل التالي:

```typescript
  // Helper: check if user is admin via Custom Claims or Firestore
  async function isAdminUser(firebaseUser: User): Promise<boolean> {
    try {
      // 1. Check Custom Claims first (fastest)
      const tokenResult = await firebaseUser.getIdTokenResult();
      if (tokenResult.claims.admin === true) {
        return true;
      }

      // 2. Fallback to Firestore document check
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        return true;
      }

      // 3. Bootstrap: If no users exist in the collection, make the first one an admin
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }
```

### 2. تحديث دالة `signIn`
لكي تستخدم دالة `isAdminUser` المحسنة بدلاً من قراءة الـ Claims مباشرة، لتكون جزئية التحقق فيها كالتالي:

```typescript
  async function signIn(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    
    // Reload user to get latest emailVerified status
    await cred.user.reload();
    
    // Check if user is an admin using our robust helper
    const isAdmin = await isAdminUser(cred.user);
    
    // If admin — allow login immediately regardless of emailVerified
    if (isAdmin) {
      console.log('Admin login detected');
      // Ensure admin Firestore document exists
      await ensureAdminDocument(cred.user);
      return;
    }
    
    // Not admin — check email verification
    if (!cred.user.emailVerified) {
      await firebaseSignOut(auth);
      throw new Error('EMAIL_NOT_VERIFIED');
    }
    
    // Check Firestore document exists
    const userDocRef = doc(db, 'users', cred.user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      await firebaseSignOut(auth);
      throw new Error('الحساب غير مسجل في النظام. تواصل مع المدرس.');
    }
  }
```

هل يمكنك مراجعة هذا الحل والتأكد من أنه مناسب وآمن لحل مشكلة توجيه الأدمن؟

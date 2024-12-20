import firebaseApp from "../../firebase";
import { doc, getFirestore, onSnapshot } from "firebase/firestore";
import { globalActions } from "store/slices/global/slice";
import { getPlanName, isPremiumUser } from "utils/PremiumUtils";
import Logger from "lib/logger";

export const userSubscriptionDocListener = (dispatch, uid) => {
  if (uid) {
    try {
      const db = getFirestore(firebaseApp);
      const userSubscriptionDocRef = doc(db, "individualSubscriptions", uid);
      onSnapshot(
        userSubscriptionDocRef,
        (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            const planDetails = newSchemaToOldSchemaAdapter(data);
            const isUserPremium = isPremiumUser(planDetails);

            dispatch(
              globalActions.updateUserPlanDetails({
                userPlanDetails: {
                  ...planDetails,
                  planName: getPlanName(planDetails),
                },
                isUserPremium,
              })
            );
          }
        },
        (err) => {
          Logger.log(`Encountered error: ${err}`);
        }
      );
    } catch (err) {
      dispatch(
        globalActions.updateUserPlanDetails({
          userPlanDetails: null,
          isUserPremium: false,
        })
      );
    }
  } else {
    dispatch(
      globalActions.updateUserPlanDetails({
        userPlanDetails: null,
        isUserPremium: false,
      })
    );
  }
};

export const newSchemaToOldSchemaAdapter = (firestoreData) => {
  if (!firestoreData) {
    return null;
  }

  const planDetails = {
    planId: firestoreData?.plan,
    status: firestoreData?.subscriptionStatus,
    subscription: {
      cancelAtPeriodEnd: firestoreData?.cancel_at_period_end || false,
      endDate:
        firestoreData?.subscriptionCurrentPeriodEnd &&
        new Date(firestoreData?.subscriptionCurrentPeriodEnd * 1000).toISOString().split("T")[0],
      startDate:
        firestoreData?.subscriptionCurrentPeriodEnd &&
        new Date(firestoreData?.subscriptionCurrentPeriodStart * 1000).toISOString().split("T")[0],
      id: firestoreData?.stripeActiveSubscriptionID,
    },
    type: firestoreData?.type,
  };

  return planDetails;
};

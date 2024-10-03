import * as express from "express";
import { editUserData,  getUserData,  runningGame, userRegister } from "../../controller/unity_api/user_controller";
import { auth } from "../../middleware/auth.middleware";
import { codeWithLobby, getLobbys } from "../../controller/unity_api/lobbys_controller";
import { addCoins, getAppStoreList } from "../../controller/unity_api/inAppPurchase_controller";
import { buyAvatar, getAllAavatar, useAvatar } from "../../controller/unity_api/avatars_controller";
import { getUser } from "../../../main/gamePlay/cache/User";


const router = express.Router()

// user Routes
router.post("/userRegister", userRegister);
router.post("/editUserData",auth, editUserData);
router.post("/runningGame", runningGame);
router.post("/getUser", getUserData);

// lobby routes
router.post("/codeWithLobby", codeWithLobby);
router.post("/getLobbys",auth, getLobbys);

// InAppPurchases routes
router.post("/addCoins",auth, addCoins);
router.post("/getCoinProduct", auth, getAppStoreList);

/* avatars routes */
router.post("/getavatars", auth, getAllAavatar);
router.post("/useavatar", auth, useAvatar);
router.post("/buyavatar", auth, buyAvatar);


export default router
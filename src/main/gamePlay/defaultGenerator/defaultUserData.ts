import { userIf } from "../../interfaces/userSignUpIf";
const { ObjectID } = require('mongodb');



function defaultUserData(signUpData: userIf): userIf {
    // generates the user default fields for the game
    const currentTimestamp = new Date();

    const data: userIf = {
        _id: ObjectID().toString(),
        userId: signUpData.userId,
        username: signUpData.username,
        socketId: signUpData.socketId,
        profilePicture: signUpData.profilePicture,
        lobbyId: signUpData.lobbyId.toString(),
        OldLobbyId: "",
        isFTUE: signUpData.isFTUE,
        fromBack: signUpData.fromBack,
        gameId: signUpData.gameId,
        oldTableId: [],
        dealType: signUpData.dealType,
        gamePoolType : signUpData.gamePoolType,
        tableId: signUpData.tableId,
        maximumSeat: signUpData.maximumSeat,
        // balance: signUpData.balance,
        bootAmount: signUpData.bootAmount,
        isUseBot: signUpData.isUseBot,
        isBot: signUpData.isBot,
        location: signUpData.location,
        authToken: signUpData.authToken,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
        minPlayer: signUpData.minPlayer,
        moneyMode: signUpData.moneyMode,
        platformCommission: signUpData.platformCommission,
        rummyType: signUpData.rummyType,
        isLink:signUpData.isLink,
        isCreateRoom : signUpData.isCreateRoom,
        isReferralCode : signUpData.isReferralCode,
        isPrivateTableContinue: signUpData.isPrivateTableContinue
              ? signUpData.isPrivateTableContinue
              : false,
        gameEntryFee:signUpData.gameEntryFee,
        isSplit : signUpData.isSplit,
        avatarName:signUpData.avatarName,
        isCash:signUpData.isCash,
        coins: signUpData.coins,
        winCash : signUpData.winCash,
        cash : signUpData.cash,
        bonus : signUpData.bonus,
        botJoinTimer: signUpData.botJoinTimer,
        botType: signUpData.botType,
        botSeatCount: signUpData.botSeatCount

    };
    return data;
}


export = defaultUserData
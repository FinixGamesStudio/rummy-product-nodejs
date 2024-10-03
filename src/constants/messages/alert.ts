export = Object.freeze({
    TYPE: {
        COMMON_POPUP: 'commonPopup',
        TOST_POPUP: 'centerToastPopup',
        TOP_TOAST_POPUP: 'topToastPopup',
        MIDDLE_TOAST_POPUP: 'middleToastPopup',
        COMMON_TOAST_POPUP: 'commonToastPopup',
        TOP_MIDDLE_TOAST_POPUP : `topMiddleTostPopup`,
        DOWN_CENTER_TOAST_POPUP : `downCenterToastPopup`,
        WAIT_MIDDLE_TOAST_POPUP: 'waitMiddleToastPopup',
        INVALID_CODE_POPUP:'invalidCodePopup'
    },
    BUTTON_COLOR: {
        RED: 'red',
        GREEN: 'green',
        YELLOW: 'yellow',
        BLUE: 'blue',
    },
    BUTTON_TEXT: {
        OK: 'Okay',
        YES: 'Yes',
        NO: 'No',
        EXIT: 'Exit',
        NEW_GAME: "NEW GAME",
        RE_JOIN_GAME:"REJOIN",
        CREATE_ROOM : "Create Room",
        COPY : "Copy",
        JOIN_ROOM : "Join Room",
        RETRY : "RETRY",
        BUYNOW:"BUYNOW",
        CLOSE:"CLOSE"
    },
    BUTTON_METHOD: {
        OK: 'PopupOkBtn',
        YES: 'PopupPlayAgainYes',
        NO: 'PopupPlayAgainNo',
        FTUESkipYes: 'PopupFTUESkipYes',
        FTUESkipNo: 'PopupFTUESkipNo',
        NEW_SIGNUP: 'PopupNewSignup',
        EXIT: 'PopupExitBtnClick',
        REJOIN:`PopupReJoinGame`,
        NEW_LOBBY_SIGNUP : `PopupNewLobbySignup`,
        CREATE_ROOM : "Create Room",
        COPY_TEXT : "CopyText",
        JOIN_ROOM : "Join Room",
        HIDE_POPUP :"HideServer_CommonPopup",
        NEW_GAME : 'NewGame',
        EXIT_BTN_CLICK  : 'ExitBtnClick',
        RESETAUTHTOKEN:"ResetAuthToken",
        BUYCOINAPICALL:"BuyCoinApiCall",
        POPUPEXITBTNCLICK:"PopupExitBtnClick"

    },

    POPUP_TITLE: 'Alert',
    POPUP_TYPE: 'AcknowledgeEvent',
    //rejoin class
    REJOIN_POPUP_TYPE: 'Acknowledge Event',
    REJOIN_POPUP_MESSAGE: 'success',
    REJOIN_POPUP_TITLE: 'Alert',

    LOCK_IN_STATE: 'you are already in lock in state',
    JOIN_OLD_LOBBBY: "Your previous table still running.if you want to join previous table, please click on REJOIN button.",

})
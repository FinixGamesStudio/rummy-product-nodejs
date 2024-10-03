import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { userSeatsIf } from "../../../../interfaces/roundTableIf";
import Scheduler from "../../../../scheduler";
import botAutoDeclareCancel from "../../../../scheduler/cancelJob/BOT/botAutoDeclare.cancel";
import botCardPickTurnTimerCancel from "../../../../scheduler/cancelJob/BOT/botCardPickTurnTimer.cancel";
import botFinishCardTimerCancel from "../../../../scheduler/cancelJob/BOT/botFinishCardTimer.cancel";
import botTurnTimerCancel from "../../../../scheduler/cancelJob/BOT/botTurnTimer.cancel";
import botWinTimerCancel from "../../../../scheduler/cancelJob/BOT/botWinTimer.cancel";
import findBotTimerCancel from "../../../../scheduler/cancelJob/BOT/findBot.cancel";

async function cancelAllTimers(
    tableId: string,
    seats: userSeatsIf,
    isLeaveTimercancel = false
) {
    try {
        logger.info("----->> cancelAllTimers <<--------")
        await Scheduler.cancelJob.WaitingForPlayerCancel(tableId);
        await Scheduler.cancelJob.initializeGameTimerCancel(tableId);
        await Scheduler.cancelJob.LockInPeriodTimerCancel(tableId);
        await Scheduler.cancelJob.BootCollectTimerCancel(tableId);
        await Scheduler.cancelJob.tossCardTimerCancel(tableId);
        await Scheduler.cancelJob.distributeCardsTimerCancel(tableId);
        await Scheduler.cancelJob.TurncancelCancel(tableId);
        await Scheduler.cancelJob.secondaryTimerCancel(tableId);
        await Scheduler.cancelJob.StartFinishTimerCancel(tableId);
        await Scheduler.cancelJob.RemainPlayersdeclarTimerCancel(tableId);
        await Scheduler.cancelJob.ScoreBoardTimerCancel(tableId);
        await Scheduler.cancelJob.splitAmountTimerCancel(tableId);

        /* bot scheduler cancel */
        await botCardPickTurnTimerCancel(`botPickCard:${tableId}`);
        await botFinishCardTimerCancel(`botFinishCard:${tableId}`);
        await botTurnTimerCancel(`botTurn:${tableId}`);
        await botWinTimerCancel(`botWin:${tableId}`);
        await findBotTimerCancel(`botJoinTimer:${tableId}`);
        await botAutoDeclareCancel(`botAutoDeclare:${tableId}`);

        if (isLeaveTimercancel) {
            for await (const seat of Object.keys(seats)) {
                if (Object.keys(seats[seat]).length > NUMERICAL.ZERO) {
                    await Scheduler.cancelJob.LeaveTableTimerCancel(`${tableId}:${seats[seat].userId}`);
                }
            }
        }

    } catch (error) {
        logger.error("--- cancelAllTimers :: ERROR :: ", error);
        throw error;
    }
}

export = cancelAllTimers;
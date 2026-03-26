export enum RealtimeMessageCodes {
    LOGGED_IN = 'logged_in'
}

const RealtimeMessages: Record<RealtimeMessageCodes, string> = {
    [RealtimeMessageCodes.LOGGED_IN]: "Someone just logged in to your account"
}

export function createRealtimePayload(code: RealtimeMessageCodes) {
    const payload = {
        code: code,
        message: RealtimeMessages[code],
        timestamp: new Date().toISOString()
    }

    return JSON.stringify(payload)
}
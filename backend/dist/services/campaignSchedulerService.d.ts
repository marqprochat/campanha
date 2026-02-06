declare class CampaignSchedulerService {
    private isRunning;
    private intervalId;
    private campaignSessionIndexes;
    start(): void;
    stop(): void;
    private processCampaigns;
    private getNextSequentialSession;
    private startCampaign;
    private processNextMessage;
    private processVariables;
    private selectRandomVariation;
    private sendMessageViaEvolution;
    private sendMessageViaQuepasa;
    private sendMessageViaWaha;
    private completeCampaign;
    private isWithinTimeWindow;
}
declare const campaignScheduler: CampaignSchedulerService;
export default campaignScheduler;
//# sourceMappingURL=campaignSchedulerService.d.ts.map
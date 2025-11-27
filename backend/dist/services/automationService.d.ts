export declare enum TriggerType {
    CONTACT_CREATED = "CONTACT_CREATED",
    CONTACT_UPDATED = "CONTACT_UPDATED",
    CAMPAIGN_COMPLETED = "CAMPAIGN_COMPLETED",
    MESSAGE_DELIVERED = "MESSAGE_DELIVERED",
    MESSAGE_READ = "MESSAGE_READ",
    MESSAGE_FAILED = "MESSAGE_FAILED",
    TIME_BASED = "TIME_BASED",
    WEBHOOK_RECEIVED = "WEBHOOK_RECEIVED",
    TAG_ADDED = "TAG_ADDED",
    TAG_REMOVED = "TAG_REMOVED"
}
export declare enum ConditionType {
    EQUALS = "EQUALS",
    NOT_EQUALS = "NOT_EQUALS",
    CONTAINS = "CONTAINS",
    NOT_CONTAINS = "NOT_CONTAINS",
    GREATER_THAN = "GREATER_THAN",
    LESS_THAN = "LESS_THAN",
    IN_LIST = "IN_LIST",
    NOT_IN_LIST = "NOT_IN_LIST",
    HAS_TAG = "HAS_TAG",
    NOT_HAS_TAG = "NOT_HAS_TAG",
    DATE_RANGE = "DATE_RANGE"
}
export declare enum ActionType {
    SEND_MESSAGE = "SEND_MESSAGE",
    ADD_TAG = "ADD_TAG",
    REMOVE_TAG = "REMOVE_TAG",
    CREATE_CAMPAIGN = "CREATE_CAMPAIGN",
    SEND_EMAIL = "SEND_EMAIL",
    WEBHOOK_CALL = "WEBHOOK_CALL",
    UPDATE_CONTACT = "UPDATE_CONTACT",
    CREATE_NOTIFICATION = "CREATE_NOTIFICATION",
    DELAY = "DELAY",
    CONDITIONAL_BRANCH = "CONDITIONAL_BRANCH"
}
interface AutomationFlow {
    id?: string;
    name: string;
    description: string;
    tenantId: string;
    active: boolean;
    trigger: FlowTrigger;
    conditions?: FlowCondition[];
    actions: FlowAction[];
    createdBy: string;
}
interface FlowTrigger {
    type: TriggerType;
    config: any;
}
interface FlowCondition {
    field: string;
    type: ConditionType;
    value: any;
    operator?: 'AND' | 'OR';
}
interface FlowAction {
    type: ActionType;
    config: any;
    order: number;
    delay?: number;
}
export declare class AutomationService {
    private static instance;
    private flowExecutions;
    private scheduledJobs;
    private constructor();
    static getInstance(): AutomationService;
    private initializeActiveFlows;
    createFlow(flowData: AutomationFlow): Promise<any>;
    updateFlow(flowId: string, tenantId: string, updateData: Partial<AutomationFlow>): Promise<any>;
    executeTrigger(triggerType: TriggerType, data: any): Promise<void>;
    private executeFlow;
    private evaluateConditions;
    private evaluateCondition;
    private executeActions;
    private executeAction;
    private executeSendMessageAction;
    private executeAddTagAction;
    private executeRemoveTagAction;
    private executeCreateNotificationAction;
    private executeCreateCampaignAction;
    private executeUpdateContactAction;
    private executeWebhookCallAction;
    private registerFlow;
    private unregisterFlow;
    private getFieldValue;
    private checkContactHasTag;
    private validateFlow;
    private logExecution;
    getFlows(tenantId: string, filters?: any): Promise<any[]>;
    getFlowExecutions(flowId: string, tenantId: string): Promise<any[]>;
    deleteFlow(flowId: string, tenantId: string): Promise<boolean>;
    testFlow(flowId: string, tenantId: string, testData: any): Promise<any>;
}
export declare const automationService: AutomationService;
export {};
//# sourceMappingURL=automationService.d.ts.map
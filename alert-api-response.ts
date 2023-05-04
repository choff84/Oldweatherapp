export interface AlertApiResponse{
    event: string;
    effective: Date;
    ends: Date;
    description: string;
    instruction: string;
    
}
export interface AlertHeadlineApiResponse{
    NWSheadline: string;
}
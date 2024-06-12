export class Result {
    constructor(public success: boolean, public message : string, public data? : any) {}
}



export class JSONResponse {
    constructor(public success: boolean, public message : string, public data? : any, public data1?: any) {}
}
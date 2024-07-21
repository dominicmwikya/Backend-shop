export class Result {
    private _success: boolean;
    private _message: string;
    private _data?: any;


    constructor(success: boolean, message: string, data?: any) {
        this._success = success;
        this._message = message;
        this._data = data;
    }

    get message(): string {
        return this._message;
    }
    set message(value: string) {
        this._message = value;
    }
    get success(): boolean {
        return this._success;
    }
    set success(value: boolean) {
        this._success = !!value;
    }
    get data(): any {
        return this._data;
    }
    set data(value: any) {
        this._data = value;      
    }
}

export class JSONResponse {
    private _success: boolean;
    private _message: string;
    private _data?: any;
    private _data1?: any;

    constructor(success: boolean, message: string, data?: any, data1?: any) {
        this._success = success;
        this._message = message;
        this._data = data;
        this._data1 = data1;
    }
    // Getter and Setter for data1
    get data1(): any {
        return this._data1;
    }

    set data1(value: any) {
        this._data1 = value;
    }
    // Getter and Setter for message
    get message(): string {
        return this._message;
    }

    set message(value: string) {
        this._message = value;
    }

    // Getter and Setter for success
    get success(): boolean {
        return this._success;
    }

    set success(value: boolean) {
        this._success = value;
    }
    // Getter and Setter for data
    get data(): any {
        return this._data;
    }

    set data(value: any) {
        this._data = value;
    }

}
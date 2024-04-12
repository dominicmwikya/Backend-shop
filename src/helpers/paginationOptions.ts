export class PaginationOptions {
    take?: number;
    skip?: number;
    order?: object;
    where?: object;
    relations?: string[];
    orderBy?: string;
}


export class PaginationData<T> {
    total: number;
    limit: number;
    page: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
    data: T[];
}
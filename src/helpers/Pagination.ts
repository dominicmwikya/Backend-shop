import { Repository, FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginationOptions } from 'src/helpers/paginationOptions';
import { PaginationData } from 'src/helpers/paginationOptions';

// T extends ObjectLiteral means that the type T must be an object type.
export async function Pagination<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: PaginationOptions & { search?: any },
): Promise<PaginationData<T>> {
    // Extract the options or use empty objects as defaults.
    const { take, skip, order = {}, where = {}, search, relations } = options || {};

    // If a search parameter is provided, add it to the 'where' clause.
    const updatedWhere = search ? { ...where, ...search } : where;

    // Build the query options for TypeORM's findAndCount method.
    const queryOptions: FindManyOptions<T> = { take, skip, order, where: updatedWhere, relations };

    // Perform the query and count the total number of entities.
    const [result, total] = await repository.findAndCount(queryOptions);

    // Calculate pagination metadata.
    const take1 = take ?? 1;
    const skip1 = skip ?? 0;
    const totalPages = Math.ceil(total / take1);
    const currentPage = Math.floor(skip1 / take1) + 1;
    const nextPage = skip1 + take1 < total ? currentPage + 1 : null;
    const prevPage = skip1 - take1 >= 0 ? currentPage - 1 : null;

    // Build the final PaginationData object containing the results and metadata.
    const paginationData: PaginationData<T> = {
        total,
        limit: take1,
        page: currentPage,
        totalPages,
        nextPage,
        prevPage,
        data: result,
    };
    return paginationData;
}

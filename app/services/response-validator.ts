export interface ApiResponse<T = any> {
    status: number;
    statusText?: string;
    data?: T;
  }
  
  export function validateOrThrowApiResponse<T = any>(responseObj: ApiResponse<T> | null | undefined): T {
    const isInvalid =
      !responseObj ||
      responseObj.status < 200 ||
      responseObj.status > 299;
  
    if (isInvalid && responseObj) {
      let errorMessage = 'Error';
      if (responseObj.status === 500) {
        errorMessage = 'Server error';
      } else if (responseObj.statusText) {
        errorMessage = responseObj.statusText;
      }
      throw new Error(errorMessage);
    } else if (!responseObj) {
      throw new Error('No response from server');
    }
  
    return responseObj.data as T;
  }
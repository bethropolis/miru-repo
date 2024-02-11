import axios from 'axios';


/**
 * @typedef {Object} CustomHeaders
 * @property {string} Miru-Url - Custom URL header
 */

/**
 * @typedef {Object} CustomRequestOptions
 * @property {CustomHeaders} headers - The headers to include in the request
 * @property {string} [method] - The method for the request (e.g., GET, POST)
 */  

if (typeof Bun !== "undefined") {
    axios.defaults.headers.common["Accept-Encoding"] = "gzip";
  }

/**
 * Sends a request to the specified URL with the given options and returns the response data.
 *
 * @param {string} url - The URL to send the request to.
 * @param {CustomRequestOptions} options - The options for the request.
 * @return {Promise<any>} A promise that resolves with the response data if the request is successful,
 *                   or rejects with an error if the request fails.
 */
export async function request(url, options) { 
    try {  
        const response = await axios(url, {...options, timeout: 15000});
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Error, server returned status code:' + response.status);
        }
    } catch (error) {
        throw new Error(error.message);
    }

}

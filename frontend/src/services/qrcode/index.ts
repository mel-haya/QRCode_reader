import {
  useQuery,
  useMutation,
} from '@tanstack/react-query'

import axios from '@/config/axios'

const imagesUpload = (data: string[]) => {
    return axios.post('/qr/upload-images/', { images: data})
}

const useImagesUpload = () => {
    return useMutation(
        {
            mutationFn: imagesUpload,
        }
    )
}

export {
    useImagesUpload,
}
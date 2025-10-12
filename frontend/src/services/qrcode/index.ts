import {
  useMutation,
} from '@tanstack/react-query'

import axios from '@/config/axios'

interface ImageUploadPayload {
    images: string[],
    socketId: string
}

const imagesUpload = (payload: ImageUploadPayload) => {
    return axios.post('/qr/upload-images/', payload)
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
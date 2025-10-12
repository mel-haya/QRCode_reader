import {
  useQuery,
  useMutation,
} from '@tanstack/react-query'

import axios from '@/config/axios'

const imagesUpload = ({ images, socketId }) => {
    return axios.post('/qr/upload-images/', { images, socketId })
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
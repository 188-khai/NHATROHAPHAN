import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface ImageLightboxModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
}

export default function ImageLightboxModal({ isOpen, onClose, imageUrl }: ImageLightboxModalProps) {
    if (!imageUrl) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <div className="fixed inset-0 bg-black/80 transition-opacity" />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-transparent text-left shadow-xl transition-all sm:max-w-4xl sm:w-full">
                            <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block z-10">
                                <button
                                    type="button"
                                    className="rounded-md bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 focus:outline-none p-2"
                                    onClick={onClose}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>

                            <img
                                src={imageUrl}
                                alt="Phóng to"
                                className="w-full h-auto max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            />
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}

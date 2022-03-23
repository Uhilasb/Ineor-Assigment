import React from "react";
import { useState, useEffect } from "react";
import Input from './Input';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import { useNavigate } from "react-router";


const Form = () => {
    let navigate = useNavigate();
    const [services, setServices] = useState([]);
    const [barbers, setBarbers] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedService, setSelectedService] = useState();
    const [selectedBarber, setSelectedBarber] = useState();
    const [bookingForm, setValue] = useState({});
    const [appointmentTimeFrames, setAppointmentTimeFrames] = useState([]);
    const [generatedSelectedTimeFrame, setGeneratedSelectedTimeFrame] = useState([]);
    const [letUserBook, setLetUserBook] = useState(false);
    const [displayErrorMessages, setDisplayErrorMessages] = useState(false);

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_BASEURL}/services`).then((response) => {
            setServices(response.data);
        });
        axios.get(`${process.env.REACT_APP_BASEURL}/barbers`).then((response) => {
            setBarbers(response.data);
        });
        axios.get(`${process.env.REACT_APP_BASEURL}/appointments`).then((response) => {
            setAppointments(response.data);
        });
    }, []);

    useEffect(() => {

        let tempServiceObject = services.find((service) => JSON.stringify(service.id) === selectedService)

        setValue((prevState) => ({
            ...prevState,
            price: tempServiceObject?.price
        }));

    }, [selectedService])

    useEffect(() => {
        let tempArray = []
        let filteredAppointments = []

        if (bookingForm.date) {
            filteredAppointments = appointments.filter((appointment) => moment(appointment.startDate).format('DD.MM.YYYY') === moment(bookingForm.date).format('DD.MM.YYYY'))
        } else {
            filteredAppointments = appointments
        }

        filteredAppointments.forEach((appointment) => {
            let foundService = services.find((service) => JSON.stringify(service.id) === selectedService)
            let startTime = moment(appointment.startDate).format('HH:mm')
            let endTime = moment(appointment.startDate).add(foundService?.durationMinutes ? foundService.durationMinutes : '0', 'minutes').format('HH:mm')
            tempArray.push(`${startTime} to ${endTime}`)
        })
        setAppointmentTimeFrames(tempArray)

    }, [appointments, bookingForm.date, selectedService])

    useEffect(() => {
        if (bookingForm.time) {
            let tempServiceObject = services.find((service) => JSON.stringify(service.id) === selectedService)
            let tempGeneratedTimeFrameStartDate = moment().set('hours', bookingForm?.time?.split(':')[0]).set('minutes', bookingForm?.time?.split(':')[1]).format('HH:mm')
            let tempGeneratedTimeFrameEndDate = moment(moment().set('hours', bookingForm?.time?.split(':')[0]).set('minutes', bookingForm?.time?.split(':')[1])).add(`${tempServiceObject?.durationMinutes}`, 'minutes').format('HH:mm')
            setGeneratedSelectedTimeFrame([tempGeneratedTimeFrameStartDate, tempGeneratedTimeFrameEndDate])
        }
    }, [bookingForm?.time, selectedService])

    useEffect(() => {
        let responsesFromConditions = []
        if (appointmentTimeFrames.length !== 0) {
            appointmentTimeFrames?.forEach((timeFrame) => {
                let timeFrameSplitArray = timeFrame.split(' to ')
                responsesFromConditions = checkIfMyBookingFulfillsConditions(timeFrameSplitArray[0], timeFrameSplitArray[1], generatedSelectedTimeFrame[0], generatedSelectedTimeFrame[1])
            })

            if (responsesFromConditions[0] && responsesFromConditions[1]) {
                setLetUserBook(true)
            } else {
                setLetUserBook(false)
            }
        } else {
            setLetUserBook(true)
        }

    }, [appointmentTimeFrames, generatedSelectedTimeFrame])

    function checkIfMyBookingFulfillsConditions(appoinmentTimeFrameStartTime, appointmentTimeFrameEndTime, selectedStartTime, selectedEndTime) {
        if (appoinmentTimeFrameStartTime && appointmentTimeFrameEndTime && selectedStartTime && selectedEndTime) {
            let tempStartDateSplit = appoinmentTimeFrameStartTime?.split(":");
            let tempEndDateSplit = appointmentTimeFrameEndTime?.split(":");
            let tempSelectedStartDateSplit = selectedStartTime?.split(":");
            let tempSelectedEndDateSplit = selectedEndTime?.split(":");
            let tempStartDate = moment()?.add(tempStartDateSplit[0], 'hours')?.add(tempStartDateSplit[1], 'minutes')?.format('DD.MM.YYYY - HH:mm:ss')
            let tempEndDate = moment()?.add(tempEndDateSplit[0], 'hours')?.add(tempEndDateSplit[1], 'minutes')?.format('DD.MM.YYYY - HH:mm:ss')
            let tempSelectedStartDate = moment()?.add(tempSelectedStartDateSplit[0], 'hours')?.add(tempSelectedStartDateSplit[1], 'minutes')?.format('DD.MM.YYYY - HH:mm:ss')
            let tempSelectedEndDate = moment()?.add(tempSelectedEndDateSplit[0], 'hours')?.add(tempSelectedEndDateSplit[1], 'minutes')?.format('DD.MM.YYYY - HH:mm:ss')
            let startDatePassed = moment(tempSelectedStartDate)?.isBetween(tempStartDate, tempEndDate);
            let endDatePassed = moment(tempSelectedEndDate)?.isBetween(tempStartDate, tempEndDate);

            return [!startDatePassed, !endDatePassed]
        } else {
            return [false, false]
        }
    }

    const valueHanlder = (e) => {
        setValue((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    };

    const handleSelect = (e) => {
        setValue((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value
        }));
    }

    function findSelectedBarber(barber) {
        return JSON.stringify(barber.id) === selectedBarber
    }

    const submitForm = () => {
        setDisplayErrorMessages(true)
        if (!bookingForm.firstName || !bookingForm.lastName ||
            !bookingForm.email || !selectedBarber || !bookingForm.phoneNumber ||
            !selectedService || !bookingForm.date ||
            !bookingForm.time) {
            return
        }
        let tempBarberObject = barbers.find(findSelectedBarber)
        let givenDate = new Date(bookingForm.date);
        let time = bookingForm?.time.split(":");
        let day = givenDate.getDay();

        tempBarberObject.workHours.forEach(hour => {
            if (day === hour.day) {
                if (
                    hour.startHour <= time[0] &&
                    time[0] <= hour.endHour
                ) {
                    if (time[0] < hour.lunchTime.startHour || (time[0] >= hour.lunchTime.startHour && time[1] > hour.lunchTime.durationMinutes)) {
                        bookTheBarber()
                    } else {
                        toast.error('11:00 to 11:30 is lunch time.');
                    }
                } else {
                    toast.error('This schedule is out working hours');
                }
            }
        })
    }

    function bookTheBarber() {
        let payload = {
            ...bookingForm,
            service: selectedService,
            barber: selectedBarber
        }
        if (letUserBook) {
            axios.post(`${process.env.REACT_APP_BASEURL}/appointments`, payload).then(() => {
                toast.success('Appointment booked successfully');
                navigate('/success')
            });
        } else {
            toast.error('Appointment is already booked! Try with another schedule');
        }
    }

    return (
        <div className="form--model">
            <div className="form--header--block">
                <h1 className="form--header">Book your Appointment</h1>
            </div>
            <div className="form--inputs">
                <div className="form--control mr">
                    <Input
                        name={'firstName'}
                        type={'text'}
                        value={bookingForm}
                        onChange={valueHanlder}
                        placeholder="First Name"
                    />
                    {displayErrorMessages && !bookingForm.firstName && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control">
                    <Input
                        name={'lastName'}
                        type={'text'}
                        value={bookingForm}
                        onChange={valueHanlder}
                        placeholder="Last Name"
                    />
                    {displayErrorMessages && !bookingForm.lastName && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control mr">
                    <Input
                        name={'email'}
                        type={'email'}
                        value={bookingForm}
                        onChange={valueHanlder}
                        placeholder="Email"
                    />
                    {displayErrorMessages && !bookingForm.email && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control">
                    <Input
                        name={'phoneNumber'}
                        type={'tel'}
                        value={bookingForm}
                        onChange={valueHanlder}
                        placeholder="Phone"
                    />
                    {displayErrorMessages && !bookingForm.phoneNumber && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control mr">
                    <select name={'barber'} className="select--input" onChange={(e) => setSelectedBarber(e.target.value)}>
                        <option value="" disabled selected className="option--value">Select barber</option>
                        {barbers.length > 0 &&
                            barbers.map((barber) => {
                                return (
                                    <>
                                        <option value="1" className="option--value" onChange={handleSelect}>{barber?.firstName}</option>
                                    </>
                                );
                            })}
                    </select>
                    {displayErrorMessages && !selectedBarber && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control">
                    <select name={'service'} className="select--input" onChange={(e) => setSelectedService(e.target.value)}>
                        <option value="" disabled selected className="option--value">Select Service</option>
                        {services.length > 0 &&
                            services.map((service) => {
                                return (
                                    <>
                                        <option value={service.id} className="option--value" onChange={handleSelect}>{service?.name}</option>
                                    </>
                                );
                            })}
                    </select>
                    {displayErrorMessages && !selectedService && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control mr">
                    <Input name={'date'} type={'date'} value={bookingForm} onChange={valueHanlder} placeholder="Date" />
                    {displayErrorMessages && !bookingForm.date && <span className="error-message">This field is required</span>}
                </div>
                <div className="form--control">
                    <input type="time" id="timepicker" name={'time'} onChange={handleSelect} />
                    {displayErrorMessages && !bookingForm.time && <span className="error-message">This field is required</span>}
                </div>
                <div className="last-child">
                    <div className="form--control full-width">
                        <Input name={'price'} type={'text'} value={bookingForm} disabled placeholder="Price" />
                    </div>
                </div>
                <div className="form--submit">
                    <button className="form--button" onClick={submitForm}>BOOK</button>
                </div>
            </div>
        </div>
    );
}

export default Form;
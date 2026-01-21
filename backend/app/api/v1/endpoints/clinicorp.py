from fastapi import APIRouter, HTTPException
from app.services.clinicorp_service import clinicorp_service

router = APIRouter()

@router.get("/patients/{patient_id}")
def read_patient_from_clinicorp(patient_id: str):
    """
    Proxy para buscar paciente diretamente no Clinicorp (ou mock).
    """
    try:
        data = clinicorp_service.get_patient(patient_id)
        return data
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/appointments")
def list_appointments_from_clinicorp(start_date: str, end_date: str):
    """
    Proxy para buscar agendamentos.
    Formatos de data: YYYY-MM-DD
    """
    try:
        data = clinicorp_service.list_appointments(start_date, end_date)
        return data
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

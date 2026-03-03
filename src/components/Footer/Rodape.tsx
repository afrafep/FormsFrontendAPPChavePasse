import { MDBFooter, MDBContainer } from "mdb-react-ui-kit";
import { BsWhatsapp } from "react-icons/bs";
import "./styles.css";

export default function Rodape() {
  return (
    <MDBFooter>
      <MDBContainer>
    {/*     <b>
          <a className="whatsapp-link" href="https://wa.me/">
            <BsWhatsapp
              style={{ display: "inline", marginTop: "7px", marginLeft: "2px" }}
            />
          </a>
        </b> */}
      </MDBContainer>
    </MDBFooter>
  );
}
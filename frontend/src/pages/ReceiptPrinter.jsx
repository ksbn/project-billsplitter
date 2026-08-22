import React, { useState, useEffect } from "react";
import "./ReceiptPrinter.css";

export default function ReceiptPrinter({ orderData }) {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
      setIsPrinting(false);
      const timer = setTimeout(() => {
      setIsPrinting(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [orderData]);

  const formatCurrency = (val) => {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  return (
    <div className="printer-wrapper">
      <div className="printer-slot">
        <span>Payment Complete</span>
        <span className="status-dot">●</span>
      </div>

      <div className="paper-window">
        <div className={`receipt ${isPrinting ? 'animate-print' : ''}`}>
          <div className="receipt-header">
            <h2>{orderData?.storeName || 'AllSplits'}</h2>
            <p>Order #{orderData?.id || '0000'} • {orderData?.date || 'Today'}</p>
          </div>

          <div className="receipt-body">
            {orderData?.members && orderData.members.length > 0 ? (
              orderData.members.map((member, idx) => (
                <div key={idx} className="receipt-user-section">
                  <div className="receipt-user-title">
                    👤 {member.name.toUpperCase()}
                  </div>

                  {member.items.length > 0 ? (
                    member.items.map((item, itemIdx) => (
                      <div className="receipt-row" key={itemIdx}>
                        <span>{item.qty}x {item.name}</span>
                        <span>€{formatCurrency(item.price)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="receipt-row muted">
                      <span>No items ordered</span>
                      <span>€0.00</span>
                    </div>
                  )}

                  <div className="receipt-row user-subtotal">
                    <span>{member.name}'s Total</span>
                    <span>€{formatCurrency(member.total)}</span>
                  </div>

                  <div className="divider-light" />
                </div>
              ))
            ) : (
              <div className="receipt-row">
                <span>Group Total</span>
                <span>€{formatCurrency(orderData?.total)}</span>
              </div>
            )}

            <div className="divider" />

            <div className="receipt-row total">
              <span>Grand Total</span>
              <span>€{formatCurrency(orderData?.total)}</span>
            </div>
          </div>

          <div className="receipt-footer">
            <p>Paid via {orderData?.paymentMethod || 'Revolut'}</p>
            <div className="barcode">||||| | |||| ||| |||||</div>
          </div>
        </div>
      </div>
    </div>
  );
}